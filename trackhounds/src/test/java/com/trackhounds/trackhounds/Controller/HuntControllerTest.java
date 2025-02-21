package com.trackhounds.trackhounds.Controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Exception.GlobalExceptionHandler;
import com.trackhounds.trackhounds.Service.HuntService;

/**
 * Test class for Hunt Controller
 */
@WebMvcTest(HuntController.class)
@Import(GlobalExceptionHandler.class)
@ActiveProfiles("test")
public class HuntControllerTest {

    /**
     * Mock MVC for api calls
     */
    private MockMvc mockMvc;

    /**
     * Hunt Service
     */
    @Autowired
    @MockitoBean
    private HuntService huntService;

    /**
     * Hunt Controller
     */
    @InjectMocks
    private HuntController huntController;

    /**
     * Setup MVC
     */
    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(huntController).build();
    }

    /**
     * Test getting a hunt
     * 
     * @throws Exception
     */
    @Test
    void testGetHunt() throws Exception {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        when(huntService.getHunt()).thenReturn(hunt);

        mockMvc.perform(get("/hunt"))
                .andExpect(status().isOk());
    }

    /**
     * Test posting a hunt
     * 
     * @throws Exception
     */
    @Test
    void testPostHunt() throws Exception {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        when(huntService.createHunt(any(HuntEntity.class))).thenReturn(hunt);

        mockMvc.perform(post("/hunt")
                .contentType("application/json")
                .content(
                        "{\"title\":\"Test Hunt\",\"dates\":\"2025-10-12 to 2025-10-13\",\"stake\":\"ALL_AGE\",\"huntInterval\":10}"))
                .andExpect(status().isOk());
    }

    /**
     * Test editing a hunt
     * 
     * @throws Exception
     */
    @Test
    void testEditHunt() throws Exception {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        when(huntService.editHunt(any(HuntEntity.class))).thenReturn(hunt);

        mockMvc.perform(put("/hunt")
                .contentType("application/json")
                .content("{\"title\":\"New Title\",\"dates\":\"Edited\"}"))
                .andExpect(status().isOk());
    }
}
