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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.trackhounds.trackhounds.Entity.HuntEntity;
import com.trackhounds.trackhounds.Enums.StakeType;
import com.trackhounds.trackhounds.Service.HuntService;

@WebMvcTest(HuntController.class)
public class HuntControllerTest {

    private MockMvc mockMvc;

    @Autowired
    @MockitoBean
    private HuntService huntService;

    @InjectMocks
    private HuntController huntController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(huntController).build();
    }

    @Test
    void testGetHunt() throws Exception {
        HuntEntity hunt = new HuntEntity("Test Hunt", "2025-10-12 to 2025-10-13", StakeType.ALL_AGE, 10);
        when(huntService.getHunt()).thenReturn(hunt);

        mockMvc.perform(get("/hunt"))
                .andExpect(status().isOk());
    }

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
